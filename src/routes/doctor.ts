import { DoctorController } from "@/controllers/doctor/doctor.controller";
import { Router } from "express";

const doctorRouter = Router();
const doctorController = new DoctorController();

doctorRouter.post("/", doctorController.createDoctor);
doctorRouter.get("/", doctorController.getAllDoctors);
doctorRouter.get("/search", doctorController.searchDoctors);
doctorRouter.get(
  "/specialization/:specialization",
  doctorController.getDoctorsBySpecialization
);
doctorRouter.get("/:id", doctorController.getDoctorById);
doctorRouter.put("/:id", doctorController.updateDoctor);
doctorRouter.delete("/:id", doctorController.deleteDoctor);
doctorRouter.post(
  "/:doctorId/patients/:patientId",
  doctorController.addPatientToDoctor
);
doctorRouter.delete(
  "/:doctorId/patients/:patientId",
  doctorController.removePatientFromDoctor
);

export { doctorRouter };
