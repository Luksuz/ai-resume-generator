import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

// Set maximum duration for Vercel functions
export const maxDuration = 60; // Increase timeout to 60 seconds for PDF generation

// Function to structure user info
async function structureUserInfo(rawUserInfo: string, customInput?: string) {
  // Create a prompt template using object notation for messages
  const prompt = ChatPromptTemplate.fromMessages([
    {
      role: "system",
      content: `
You are a document analyzer. Your task is to extract the important data for a resume based on the specified format.
You will be given messy user info copied from a website and need to extract the data according to the format.

Extract and organize the following information in a structured way:
- name: The person's full name
- age: The person's age (as a number)
- location: Where the person is located
- email: Contact email address
- phone: Contact phone number
- links: List of relevant links (LinkedIn, GitHub, portfolio, etc.)
- interests: List each interest with a brief description
- work_experience: For each position include company, position, start_date, end_date, and description
- education: For each entry include school, degree, field_of_study, and graduation_year
- certifications: For each certification include name, organization, and date_earned
- resume_style_notes: Notes about the desired style, industry focus, or special formatting

Format your response as a valid JSON object with these fields, but DO NOT use curly braces in your response.
Instead, use a clear structured format with field names followed by values.
For arrays, use a numbered list format.

${customInput ? "ADDITIONAL INFORMATION: " + customInput : ""}
      `,
    },
    {
      role: "human",
      content: `USER INFO: ${rawUserInfo}`,
    },
  ]);

  // Create the model
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  // Chain the prompt and model together
  const outlineChain = prompt.pipe(model);

  // Execute the chain
  const result = await outlineChain.invoke({});
  
  // Parse the structured text into a JavaScript object
  const content = result.content as string;
  
  // Convert the structured text to a proper JSON object
  // This is a simple parser that assumes the model followed instructions
  const structuredInfo = parseStructuredText(content);
  
  return structuredInfo;
}

// Helper function to parse structured text into a JavaScript object
function parseStructuredText(text: string): any {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const result: any = {};
  
  let currentKey = '';
  let currentArray: any[] = [];
  
  for (const line of lines) {
    // Check if this is a main field
    const mainFieldMatch = line.match(/^([a-z_]+):\s*(.+)$/i);
    
    if (mainFieldMatch) {
      // If we were building an array, add it to the result
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }
      
      const [, key, value] = mainFieldMatch;
      currentKey = key.trim();
      
      // Check if this is the start of an array
      if (!value.trim() || value.trim() === '-') {
        currentArray = [];
      } else {
        // It's a simple key-value pair
        result[currentKey] = value.trim();
      }
    } 
    // Check if this is an array item
    else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
      const itemValue = line.replace(/^-|\d+\./, '').trim();
      
      // If it looks like a structured item with key-value pairs
      if (itemValue.includes(':')) {
        const itemObj: any = {};
        const itemParts = itemValue.split(',');
        
        for (const part of itemParts) {
          const [itemKey, itemVal] = part.split(':').map(s => s.trim());
          if (itemKey && itemVal) {
            itemObj[itemKey] = itemVal;
          }
        }
        
        currentArray.push(itemObj);
      } else {
        currentArray.push(itemValue);
      }
      
      // Make sure the array is added to the result
      if (currentKey) {
        result[currentKey] = currentArray;
      }
    }
  }
  
  return result;
}

// Function to generate HTML from structured info
async function generateResumeHtml(structuredInfo: any) {
  // Define the prompt template with a placeholder for the structured info
  const promptTemplate = `You are a resume builder. Create an HTML resume based on the provided structured information.
The resume should be well-formatted and ready to be converted to PDF.
Include appropriate styling using inline CSS.
Tailor the resume to the person's industry based on their resume_style_notes.
Output only the HTML code.

STRUCTURED INFO: {structured_info}`;

  // Create the prompt template from the string
  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);

  // Create the model
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
  });

  // Chain the prompt and model together
  const htmlChain = prompt.pipe(model);

  // Invoke the chain with the structured info
  const result = await htmlChain.invoke({ 
    structured_info: JSON.stringify(structuredInfo) 
  });

  // Extract HTML from the response and remove markdown fences
  let htmlContent = result.content as string;
  htmlContent = htmlContent.replace(/```html/g, "").replace(/```/g, "");
  return htmlContent;
}

// Function to convert HTML to PDF using Puppeteer
async function generatePdf(html: string): Promise<Buffer> {
  let browser = null;
  
  try {
    // Configure chromium
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;
    
    // Configure browser options specifically for Vercel serverless
    const options = {
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security", "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    };

    // Launch the browser
    browser = await puppeteerCore.launch(options as any);
    const page = await browser.newPage();
    
    // Set content with a longer timeout for serverless environments
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 30000 // Increase timeout to 30 seconds
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
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
    console.log("Structured info:", structuredInfo);
    
    // Generate HTML from structured info
    const html = await generateResumeHtml(structuredInfo);
    
    // Generate PDF from HTML using Puppeteer
    const pdfBuffer = await generatePdf(html);
    
    // Return the PDF file as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"`,
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
