// src/repositories/user.repository.ts
import { User } from "@/model/user/user.model";

export class UserRepository {
  public async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  public async createUser(email: string, hashedPassword: string) {
    return await User.create({ email, password: hashedPassword });
  }

  public async findById(userId: string) {
    return await User.findById(userId);
  }
}
