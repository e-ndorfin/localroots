import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getClient } from "@/lib/xrpl/client";
import { textToHex, submitTx } from "@/lib/xrpl/helpers";
import { PLATFORM_MASTER_ADDRESS } from "@/lib/constants";
import { generateStorefrontImage } from "@/lib/openai/generateStorefrontImage";
import * as xrpl from "xrpl";

const CREDENTIAL_TYPE = textToHex("REGISTERED_BUSINESS");

/**
 * POST /api/business/register
 *
 * Registers a new business:
 * 1. Validates input
 * 2. Inserts row into Supabase `businesses` table (custodial model)
 * 3. Issues a REGISTERED_BUSINESS credential on XRPL (platform master → business owner)
 *
 * Body: { name, category, location?, description? }
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const { name, category, location, description, lat, lng } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 }
      );
    }

    // Check if owner already registered a business
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This owner already has a registered business" },
        { status: 409 }
      );
    }

    // Insert business into Supabase
    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        name,
        category,
        location: location || null,
        description: description || null,
        owner_user_id: user.id,
        lat: lat ?? null,
        lng: lng ?? null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

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
          Subject: masterWallet.address, // Custodial: credential references owner in URI
          CredentialType: CREDENTIAL_TYPE,
          URI: textToHex(
            JSON.stringify({
              businessId: business.id,
              name,
              category,
              ownerUserId: user.id,
              registeredAt: new Date().toISOString(),
            })
          ),
        };

        const response = await submitTx(credentialTx, client, masterWallet, "CredentialCreate");
        credentialHash = response.result?.hash || null;

        // Update business row with credential hash
        await supabase
          .from("businesses")
          .update({ credential_hash: credentialHash })
          .eq("id", business.id);
      }
    } catch (xrplError) {
      // Log but don't fail — business is still registered in Supabase
      console.error("XRPL credential issuance failed:", xrplError.message);
    }

    // Generate storefront image (non-fatal)
    let imageUrl = null;
    try {
      imageUrl = await generateStorefrontImage({
        businessId: business.id,
        name,
        category,
        location,
      });
    } catch (imgError) {
      console.error("Storefront image generation failed:", imgError.message);
    }

    return NextResponse.json({
      ...business,
      credentialHash,
      imageUrl,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
