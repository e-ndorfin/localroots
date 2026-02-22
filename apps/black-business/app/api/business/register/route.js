const { NextResponse } = require("next/server");
const { getDb, persist } = require("../../../../lib/db");
const { getClient } = require("../../../../lib/xrpl/client");
const { textToHex, submitTx } = require("../../../../lib/xrpl/helpers");
const { PLATFORM_MASTER_ADDRESS } = require("../../../../lib/constants");
const xrpl = require("xrpl");

const CREDENTIAL_TYPE = textToHex("REGISTERED_BUSINESS");

/**
 * POST /api/business/register
 *
 * Registers a new business:
 * 1. Validates input
 * 2. Inserts row into SQLite `businesses` table (custodial model)
 * 3. Issues a REGISTERED_BUSINESS credential on XRPL (platform master → business owner)
 *
 * Body: { name, category, location?, description?, ownerPseudonym }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, location, description, ownerPseudonym } = body;

    // Validate required fields
    if (!name || !category || !ownerPseudonym) {
      return NextResponse.json(
        { error: "name, category, and ownerPseudonym are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if owner already registered a business
    const existing = db.exec(
      `SELECT id FROM businesses WHERE owner_pseudonym = '${ownerPseudonym.replace(/'/g, "''")}'`
    );
    if (existing.length && existing[0].values.length) {
      return NextResponse.json(
        { error: "This owner already has a registered business" },
        { status: 409 }
      );
    }

    // Insert business into SQLite
    db.run(
      `INSERT INTO businesses (name, category, location, description, owner_pseudonym)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category, location || null, description || null, ownerPseudonym]
    );

    // Get the newly inserted business ID
    const idResult = db.exec("SELECT last_insert_rowid() AS id");
    const businessId = idResult[0].values[0][0];

    // Issue REGISTERED_BUSINESS credential on XRPL
    let credentialHash = null;
    try {
      if (!PLATFORM_MASTER_ADDRESS || !process.env.PLATFORM_MASTER_SEED) {
        console.warn("Platform master wallet not configured — skipping credential issuance");
      } else {
        const client = await getClient();
        const masterWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);

        const credentialTx = {
          TransactionType: "CredentialCreate",
          Account: masterWallet.address,
          Subject: masterWallet.address, // Custodial: credential references owner pseudonym in URI
          CredentialType: CREDENTIAL_TYPE,
          URI: textToHex(
            JSON.stringify({
              businessId,
              name,
              category,
              ownerPseudonym,
              registeredAt: new Date().toISOString(),
            })
          ),
        };

        const response = await submitTx(credentialTx, client, masterWallet, "CredentialCreate");
        credentialHash = response.result?.hash || null;

        // Update business row with credential hash
        db.run("UPDATE businesses SET credential_hash = ? WHERE id = ?", [
          credentialHash,
          businessId,
        ]);
      }
    } catch (xrplError) {
      // Log but don't fail — business is still registered in SQLite
      console.error("XRPL credential issuance failed:", xrplError.message);
    }

    persist(db);

    return NextResponse.json({
      id: businessId,
      name,
      category,
      location: location || null,
      description: description || null,
      ownerPseudonym,
      credentialHash,
    });
  } catch (error) {
    console.error("Business registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
