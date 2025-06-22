import { Request, Response, NextFunction } from "express";
import { hashPassword, comparePasswords } from "@/utils/hash";
import { generateToken } from "@/utils/jwt";
import Logger from "@/utils/logger";
import { UserRepository } from "@/repositories/user.repository";
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
  asyncHandler,
} from "@/errors";

export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      const existingUser = await this.userRepository.findByEmail(
        email?.toLowerCase()
      );
      if (existingUser) throw new EmailAlreadyExistsError(email);

      const hashedPassword = await hashPassword(password);

      const newUserData = {
        email: email?.toLowerCase(),
        password: hashedPassword,
      };

      const user = await this.userRepository.createUser(newUserData);

      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role,
      });

      this.logger.info(`User registered successfully: ${user._id} (${email})`);

      const responseUserData = {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      return res.status(201).json({
        token,
        user: responseUserData,
      });
    }
  );

  public login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      const user = await this.userRepository.findByEmail(email?.toLowerCase());

      if (!user) throw new InvalidCredentialsError();

      const isValidPassword = await comparePasswords(password, user.password);

      if (!isValidPassword) throw new InvalidCredentialsError();

      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role,
      });

      this.logger.info(`User logged in successfully: ${email}`);

      const responseUserData = {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
      return res.status(200).json({
        token,
        user: responseUserData,
      });
    }
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      if (!user) throw new UnauthorizedError("User not found in request");

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      this.logger.info(`Token refreshed for user: ${user.email}`);

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }
  );

  public logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      this.logger.info(`User logout requested: ${user?.email || "unknown"}`);

      return res.status(200).json({
        message: "Logout successful",
      });
    }
  );
}
