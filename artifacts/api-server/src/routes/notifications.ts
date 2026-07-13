import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studentsTable, termsTable } from "@workspace/db";
import { requireTeacher } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/notifications/send-report-card", requireTeacher, async (req, res): Promise<void> => {
  const { studentId, termId, channel } = req.body;

  if (!studentId || !termId || !channel) {
    res.status(400).json({ error: "studentId, termId, and channel are required" });
    return;
  }

  // Fetch student and term info
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, parseInt(studentId, 10)));

  const [term] = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.id, parseInt(termId, 10)));

  if (!student || !term) {
    res.status(404).json({ error: "Student or Term not found" });
    return;
  }

  const phone = student.guardianPhone || "N/A";
  const name = student.fullName;
  const parentName = student.guardianName || "Guardian";

  if (channel === "whatsapp") {
    // Simulated WhatsApp integration log
    console.log(`\n======================================================`);
    console.log(`[WHATSAPP MESSAGE SENT]`);
    console.log(`To: ${parentName} (${phone})`);
    console.log(`Message: Hello ${parentName}, here is the terminal report card for ${name} for ${term.name}.`);
    console.log(`Click this link to download the PDF: http://localhost:3000/parent/report-cards/${student.id}/${term.id}`);
    console.log(`======================================================\n`);
    
    res.json({ ok: true, channel: "whatsapp", target: phone });
  } else if (channel === "email") {
    // Generate a simulated email destination
    const email = `${student.fullName.toLowerCase().replace(/\s+/g, '')}.parent@school.gh`;
    
    console.log(`\n======================================================`);
    console.log(`[EMAIL SEND SENT]`);
    console.log(`To: ${parentName} (${email})`);
    console.log(`Subject: Terminal Report Card for ${name} - ${term.name}`);
    console.log(`Body: Hello ${parentName},\n\nPlease find attached the terminal report card PDF for ${name}.`);
    console.log(`URL: http://localhost:3000/parent/report-cards/${student.id}/${term.id}`);
    console.log(`======================================================\n`);

    res.json({ ok: true, channel: "email", target: email });
  } else {
    res.status(400).json({ error: "Invalid channel. Must be 'whatsapp' or 'email'" });
  }
});

export default router;
