import User from "./User";
import Profile from "./Profile";
import BugTicket from "./BugTicket";
import CodeChange from "./CodeChange";

// This file centralizes model registration to avoid "Schema hasn't been registered" errors in serverless environments
export { User, Profile, BugTicket, CodeChange };
