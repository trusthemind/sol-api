import { Doctor, IDoctor, Specialization } from "@/model/user/doctor.model";

export class DoctorRepository {
  async create(doctorData: any): Promise<IDoctor> {
    const doctor = new Doctor(doctorData);
    return await doctor.save();
  }

  async findAll(filters: any = {}): Promise<IDoctor[]> {
    const {
      page = 1,
      limit = 10,
      specialization,
      isVerified,
      minRating,
    } = filters;
    const query: any = {};

    if (specialization) query.specialization = specialization;
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (minRating) query.rating = { $gte: minRating };

    return await Doctor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<IDoctor | null> {
    return await Doctor.findById(id).populate("patients");
  }

  async update(id: string, updateData: any): Promise<IDoctor | null> {
    return await Doctor.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IDoctor | null> {
    return await Doctor.findByIdAndDelete(id);
  }

  async findByEmail(email: string): Promise<IDoctor | null> {
    return await Doctor.findOne({ email });
  }

  async findBySpecialization(
    specialization: Specialization
  ): Promise<IDoctor[]> {
    return await Doctor.find({
      specialization: specialization,
      isVerified: true,
    });
  }

  async addPatient(
    doctorId: string,
    patientId: string
  ): Promise<IDoctor | null> {
    return await Doctor.findByIdAndUpdate(
      doctorId,
      { $addToSet: { patients: patientId } },
      { new: true }
    );
  }

  async removePatient(
    doctorId: string,
    patientId: string
  ): Promise<IDoctor | null> {
    return await Doctor.findByIdAndUpdate(
      doctorId,
      { $pull: { patients: patientId } },
      { new: true }
    );
  }

  async search(query: string): Promise<IDoctor[]> {
    return await Doctor.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
      ],
      isVerified: true,
    });
  }

  async count(filters: any = {}): Promise<number> {
    const query: any = {};
    if (filters.specialization) query.specialization = filters.specialization;
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
    if (filters.minRating) query.rating = { $gte: filters.minRating };

    return await Doctor.countDocuments(query);
  }
}
