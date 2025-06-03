import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { DoctorRepository } from "@/repositories/doctor.repository";

export class DoctorController {
  private doctorRepository: DoctorRepository;

  constructor() {
    this.doctorRepository = new DoctorRepository();
  }

  createDoctor = async (req: Request, res: Response) => {
    try {
      const { password, email, ...doctorData } = req.body;

      const existingDoctor = await this.doctorRepository.findByEmail(email);
      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: "Doctor with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const doctor = await this.doctorRepository.create({
        ...doctorData,
        email,
        password: hashedPassword,
      });

      const { password: _, ...response } = doctor.toObject();

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error creating doctor",
        error: error.message,
      });
    }
  };

  getAllDoctors = async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const doctors = await this.doctorRepository.findAll(filters);
      const total = await this.doctorRepository.count(filters);

      res.status(200).json({
        success: true,
        data: doctors,
        total,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching doctors",
        error: error.message,
      });
    }
  };

  getDoctorById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doctor = await this.doctorRepository.findById(id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const { password, ...response } = doctor.toObject();

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error fetching doctor",
        error: error.message,
      });
    }
  };

  updateDoctor = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const doctor = await this.doctorRepository.update(id, updateData);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const { password, ...response } = doctor.toObject();

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error updating doctor",
        error: error.message,
      });
    }
  };

  deleteDoctor = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doctor = await this.doctorRepository.delete(id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getDoctorsBySpecialization = async (req: Request, res: Response) => {
    try {
      const { specialization } = req.params;
      const doctors = await this.doctorRepository.findBySpecialization(
        specialization as any
      );

      res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  addPatientToDoctor = async (req: Request, res: Response) => {
    try {
      const { doctorId, patientId } = req.params;
      const doctor = await this.doctorRepository.addPatient(
        doctorId,
        patientId
      );

      if (!doctor)
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });

      res.status(200).json({
        success: true,
        data: doctor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  removePatientFromDoctor = async (req: Request, res: Response) => {
    try {
      const { doctorId, patientId } = req.params;
      const doctor = await this.doctorRepository.removePatient(
        doctorId,
        patientId
      );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Patient removed from doctor successfully",
        data: doctor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error removing patient from doctor",
        error: error.message,
      });
    }
  };

  searchDoctors = async (req: Request, res: Response) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const doctors = await this.doctorRepository.search(query as string);

      res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Error searching doctors",
        error: error.message,
      });
    }
  };
}
