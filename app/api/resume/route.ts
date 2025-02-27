import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import puppeteer from "puppeteer";

// Define schemas using Zod
const Education = z.object({
  school: z.string().optional(),
  degree: z.string().optional(),
  field_of_study: z.string().optional(),
  graduation_year: z.number().optional(),
});

const WorkExperience = z.object({
  company: z.string().optional(),
  position: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

const Interests = z.object({
  interest: z.string().optional(),
  description: z.string().optional(),
});

const Certifications = z.object({
  name: z.string().optional(),
  organization: z.string().optional(),
  date_earned: z.string().optional(),
});

const StructuredUserInfo = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  location: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  links: z.array(z.string()).optional(),
  interests: z.array(Interests).optional(),
  work_experience: z.array(WorkExperience).optional(),
  education: z.array(Education).optional(),
  certifications: z.array(Certifications).optional(),
  resume_style_notes: z.string().optional(),
  custom_input: z.string().optional(),
});

// Function to structure user info
async function structureUserInfo(rawUserInfo: string, customInput?: string) {
  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `
      You are a document analyzer, your task is to extract the important data for a resume based on the specified format.
      You will be given a messy user info copied from a website and you will need to extract the data based on the specified format.
      You will need to extract the name, age, location, interests, work experience, education and resume style notes.
      Resume style notes will be used in generating the resume in html format. Extract the possible industry and based on that, extract the style.
      
      ${customInput ? "ADDITIONAL INFORMATION: " + customInput : ""}
    `],
    ["human", `USER INFO: ${rawUserInfo}`]
  ]);

  // Create the model with structured output
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  }).withStructuredOutput(StructuredUserInfo);

  // Create the chain
  const outlineChain = prompt.pipe(model);
  
  // Execute the chain
  return await outlineChain.invoke({});
}

// Function to generate HTML from structured info
async function generateResumeHtml(structuredInfo: string) {
  // Create a prompt template for HTML generation
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `
      You are a resume builder. Create HTML resume based on the provided structured information.
      The resume should be well-formatted and ready to be converted to PDF.
      Include appropriate styling within the resume using inline CSS.
      Make the resume tailored to the person's industry based on their resume_style_notes.
      Output only the HTML code.
    `],
    ["human", `STRUCTURED INFO: ${structuredInfo}`]
  ]);

  // Create the model
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
  });

  // Create the chain
  const htmlChain = prompt.pipe(model);
  
  // Execute the chain
  const result = await htmlChain.invoke({});
  
  // Extract HTML from the response
  let htmlContent = result.content as string;
  //replace ```html with empty string
  htmlContent = htmlContent.replace("```html", "");
  //replace ``` with empty string
  htmlContent = htmlContent.replace("```", "");
  return htmlContent;
}

// Function to convert HTML to PDF using Puppeteer
async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
        ],
    headless: true,
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  
  const pdfBuffer = await page.pdf({
    format: "a4",
    margin: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in"
    },
    printBackground: true
  });
  
  await browser.close();
  return Buffer.from(pdfBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, customInput } = body;
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Structure the user info
    const structuredInfo = await structureUserInfo(content, customInput);
    const structuredInfoString = JSON.stringify(structuredInfo);
    //replace curly braces with empty string
    const cleanedStructuredInfoString = structuredInfoString.replace(/[{}]/g, '');
    
    // Generate HTML from structured info
    const html = await generateResumeHtml(cleanedStructuredInfoString);
    
    // Generate PDF from HTML using Puppeteer
    const pdfBuffer = await generatePdf(html);
    console.log(pdfBuffer);
    
    // Return the PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error processing resume data:", error);
    return NextResponse.json(
      { error: "Failed to process resume data" },
      { status: 500 }
    );
  }
}