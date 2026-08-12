// File Path: /scripts/generate-promo-video.js
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.error("Error: GEMINI_API_KEY is not set or is invalid in your .env file.");
    console.log("Please add a valid Gemini API key to your .env file in the project root.");
    process.exit(1);
  }

  console.log("Initializing Gemini Client...");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = "Cinematic slow-motion shot of a beautiful, premium, multi-tiered wedding cake decorated with elegant pink sugar roses and gold foil flakes in a bright, high-end pastry kitchen. Warm lighting, shallow depth of field, ultra-realistic, 4k quality, professional pastry chef hands adding final touches.";
  
  console.log("----------------------------------------------------------------");
  console.log("Starting video generation with Google Veo...");
  console.log(`Model: veo-3.1-fast-generate-preview`);
  console.log(`Prompt: "${prompt}"`);
  console.log("----------------------------------------------------------------");

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: "16:9",
      },
    });

    console.log(`Operation initiated! Name: ${operation.name}`);
    console.log("Polling for video generation status (this can take 2-3 minutes)...");

    while (!operation.done) {
      console.log(`[${new Date().toLocaleTimeString()}] Waiting for video generation... checking in 20 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 20000));
      operation = await ai.operations.get({ operation });
    }

    if (operation.error) {
      console.error("\nVideo generation operation failed!");
      console.error(JSON.stringify(operation.error, null, 2));
      process.exit(1);
    }

    console.log("\nVideo generation completed successfully!");
    const generatedVideo = operation.response.generatedVideos[0];
    const videoFile = generatedVideo.video;

    // Ensure public folder exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const downloadPath = path.join(publicDir, 'promo_veo.mp4');
    console.log(`Downloading generated video file: ${videoFile.name} to ${downloadPath}...`);

    await ai.files.download({
      file: videoFile.name,
      downloadPath: downloadPath
    });

    console.log("\n========================================================");
    console.log(`SUCCESS! Promo video saved to: public/promo_veo.mp4`);
    console.log("The landing page will now automatically display this video.");
    console.log("========================================================");

  } catch (error) {
    console.error("\nAn error occurred during execution:");
    console.error(error);
    process.exit(1);
  }
}

main();
