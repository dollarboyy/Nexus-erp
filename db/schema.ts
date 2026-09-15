import { pgTable, uuid, text, date, timestamp, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  reportsTo: uuid("reports_to"),
  baseSalaryEnc: bytea("base_salary_enc"),
  bankAccountEnc: bytea("bank_account_enc"),
  idNumber: text("id_number"),
  startDate: date("start_date"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});