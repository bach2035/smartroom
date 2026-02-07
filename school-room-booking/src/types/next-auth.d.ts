import 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string
    name: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
  }
}
