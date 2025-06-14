import { DoctorController } from "@/controllers/doctor/doctor.controller";
import { asyncHandler } from "@/errors";
import { Router } from "express";

const doctorRouter = Router();
const doctorController = new DoctorController();

doctorRouter.post("/", asyncHandler(doctorController.createDoctor));
doctorRouter.get("/", asyncHandler(doctorController.getAllDoctors));
doctorRouter.get("/search", asyncHandler(doctorController.searchDoctors));
doctorRouter.get(
  "/specialization/:specialization",
  doctorController.getDoctorsBySpecialization
);
doctorRouter.get("/:id", asyncHandler(doctorController.getDoctorById));
doctorRouter.put("/:id", asyncHandler(doctorController.updateDoctor));
doctorRouter.delete("/:id", asyncHandler(doctorController.deleteDoctor));
doctorRouter.post(
  "/:doctorId/patients/:patientId",
  asyncHandler(doctorController.addPatientToDoctor)
);
doctorRouter.delete(
  "/:doctorId/patients/:patientId",
  asyncHandler(doctorController.removePatientFromDoctor)
);

export { doctorRouter };
