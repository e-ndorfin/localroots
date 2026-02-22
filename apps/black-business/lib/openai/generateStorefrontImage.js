import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a realistic storefront image for a business using OpenAI,
 * upload it to Supabase Storage, and update the business row.
 *
 * Non-fatal — returns the public URL on success, null on any failure.
 */
export async function generateStorefrontImage({ businessId, name, category, location }) {
  try {
    const prompt = [
      `A realistic street-level photograph of a small business storefront called "${name}".`,
      `The business is a ${category} establishment`,
      location ? `located at ${location}` : "in an urban neighborhood",
      ". The photo is taken during golden hour with warm natural lighting,",
      "showing the entrance, signage, and inviting exterior.",
      "Photorealistic, 35mm lens, shallow depth of field, no text overlays.",
    ].join(" ");

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageBase64 = response.data[0].b64_json;
    const buffer = Buffer.from(imageBase64, "base64");

    const supabase = await createClient();
    const storagePath = `storefronts/${businessId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("business-images")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    await supabase
      .from("businesses")
      .update({ image_url: publicUrl })
      .eq("id", businessId);

    return publicUrl;
  } catch (err) {
    console.error(`Image generation failed for business ${businessId}:`, err.message);
    return null;
  }
}
