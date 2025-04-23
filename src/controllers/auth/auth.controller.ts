import { Request, Response } from "express";
import { hashPassword, comparePasswords } from "@/utils/hash";
import { generateToken } from "@/utils/jwt";
import Logger from "@/utils/logger";
import { UserRepository } from "@/repositories/user.repository";

export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const hashed = await hashPassword(password);
      const user = await this.userRepository.createUser(email, hashed);

      this.logger.info(`User registered: ${user._id}`);

      return res.status(201).json({ message: "Registered successfully" });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Login method
  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({ id: user.id, email: user.email });

      this.logger.info(`User logged in: ${email}`);

      return res.status(200).json({ token });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
