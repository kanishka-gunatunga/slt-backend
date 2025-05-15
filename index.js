import express from "express";
import cors from "cors";
import multer from "multer";
import XLSX from "xlsx";
import OpenAI from "openai";
import dotenv from "dotenv"; 

dotenv.config();

// 123

const port = process.env.PORT || 3005;
const app = express();

app.use(cors());

const upload = multer();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("server is working");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).send("No file uploaded.");
    }
const documentsData = [];
    // const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    // const sheetName = workbook.SheetNames[0];
    // const sheet = workbook.Sheets[sheetName];
    // const json = XLSX.utils.sheet_to_json(sheet);

    // const cleanedData = JSON.stringify(json);

    for (const file of req.files) {
          const workbook = XLSX.read(file.buffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          documentsData.push(json);
        }
    console.log("DOC : ",JSON.stringify(documentsData))

   const prompt = `You are a helpful assistant. You will receive multiple similar CONTEXTS where all fields except pricing are mostly the same. Your task:

1. Extract shared fields **once only**: referenceNumber, customerName, location, etc.
2. Extract all pricing BOQs and return them as:
   - "solutionBOQs": [ { "source": "Document 1", ...BOQ }, { "source": "Document 2", ...BOQ } ]
3. Include "optionalItems" the same way if present.
4. Other fields like termsAndConditions should be merged if similar, or shown as an array if different.

Ensure JSON is valid. Use "null" where values are missing.

**CONTEXTS:**
${JSON.stringify(documentsData)}

Response format:

{
  "referenceNumber": "<Reference Number>",
  "customerName": "<Customer Name>",
  "designation": "<Designation>",
  "companyName": "<Company Name>",
  "requirements": "<Requirements>",
  "Address": "<Address>",
  "location": "<Location>",
  "ProjectScope": [summary of project scope],
  "solutionBOQs": [
    {
      "source": "Document 1",
      "items": [ ...BOQ rows... ]
    },
    {
      "source": "Document 2",
      "items": [ ...BOQ rows... ]
    }
  ],
  "optionalItems": [...],
  "termsAndConditions": [delivery period,terms of payment,validity of the offer,waranty,presventive and corrective maintenance,maintainance window,falicily requirements,complementary services,other remarks]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

          let cleaned = response.choices[0].message.content.replace(/```json|```/g, '').trim();
          console.log("================================")
console.log(cleaned)
    const assistantResponse = cleaned;

    res.json(assistantResponse);
  } catch (error) {
    console.error("Error processing file:", error);
    res
      .status(500)
      .send(
        "Error processing file. Please check your file format and API setup."
      );
  }
});

app.listen(port, () => {
  console.log(`server running on port ${port}...`);
});

export default app;




