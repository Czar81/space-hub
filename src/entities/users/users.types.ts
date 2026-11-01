/** Data needed to register a user. */
export interface CreateUserData {
  /** Full name. */
  name: string;
  /** Unique email, already normalized by the schema. */
  email: string;
  /** Plain text password; the service hashes it and it is never stored as is. */
  password: string;
}
