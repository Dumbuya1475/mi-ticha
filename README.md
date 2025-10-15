# Mi Ticha - AI Learning Companion

Mi Ticha is an AI-powered learning platform designed for Sierra Leone students ages 8-14. The platform provides personalized homework help and reading practice through Moe, a friendly AI tutor.

## Features

- **Chat with Moe**: Get instant homework help from an AI tutor
- **Reading Practice**: Improve reading skills with timed exercises
- **Progress Tracking**: Parents can monitor learning activities and progress
- **Safe Environment**: Secure platform with parental oversight

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js** (version 18.x or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** or **pnpm** (comes with Node.js)
- **Git** (optional, for version control)

## Getting Started

### 1. Clone or Extract the Project

If you have the ZIP file, extract it to your desired location. If using Git:

```bash
git clone https://github.com/Dumbuya1475/mi-ticha.git
cd mi-ticha
```

### 2. Install Dependencies

Navigate to the project directory and install the required packages:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory of the project. See the `ENV_SETUP.md` file for detailed instructions on configuring your environment variables, especially for Supabase integration.

### 4. Run the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000) or  [http://localhost:5000](http://localhost:5000)

### 5. Build for Production

To create a production build:

```bash
npm run build
npm start
# or
yarn build
yarn start
# or
pnpm build
pnpm start
```

## Project Structure

```
mi-ticha/
├── app/                    # Next.js app directory
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # UI components (shadcn/ui)
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── public/                 # Static assets
├── .env.local              # Environment variables (create this)
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Backend**: Supabase (Database & Authentication)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 5000
```

### Module Not Found Errors

If you encounter module errors, try deleting `node_modules` and reinstalling:

```bash
rm -rf node_modules
npm install
```

### Build Errors

Clear the Next.js cache:

```bash
rm -rf .next
npm run build
```

## Support

For issues or questions:
- Check the `ENV_SETUP.md` file for environment configuration help
- Review the Next.js documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
<!-- - Contact support at your organization -->

## License

© 2025 Mi Ticha. All rights reserved.
