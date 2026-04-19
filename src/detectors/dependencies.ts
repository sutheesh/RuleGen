import fs from 'fs';
import path from 'path';
import type { DependencyInfo } from '../types.js';

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseJsonSafe<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

type DepCategory = DependencyInfo['category'];

const KEY_DEPS: Array<{ name: string; packages: string[]; category: DepCategory }> = [
  { name: 'Prisma', packages: ['prisma', '@prisma/client'], category: 'orm' },
  { name: 'Drizzle', packages: ['drizzle-orm'], category: 'orm' },
  { name: 'TypeORM', packages: ['typeorm'], category: 'orm' },
  { name: 'Mongoose', packages: ['mongoose'], category: 'orm' },
  { name: 'Sequelize', packages: ['sequelize'], category: 'orm' },
  { name: 'NextAuth', packages: ['next-auth', '@auth/core'], category: 'auth' },
  { name: 'Clerk', packages: ['@clerk/nextjs', '@clerk/clerk-react'], category: 'auth' },
  { name: 'Auth.js', packages: ['@auth/core'], category: 'auth' },
  { name: 'Lucia', packages: ['lucia'], category: 'auth' },
  { name: 'Supabase', packages: ['@supabase/supabase-js'], category: 'auth' },
  { name: 'Redux Toolkit', packages: ['@reduxjs/toolkit'], category: 'state' },
  { name: 'Zustand', packages: ['zustand'], category: 'state' },
  { name: 'Jotai', packages: ['jotai'], category: 'state' },
  { name: 'Recoil', packages: ['recoil'], category: 'state' },
  { name: 'MobX', packages: ['mobx'], category: 'state' },
  { name: 'XState', packages: ['xstate'], category: 'state' },
  { name: 'shadcn/ui', packages: ['@shadcn/ui'], category: 'ui' },
  { name: 'Radix UI', packages: ['@radix-ui/react-dialog', '@radix-ui/react-select'], category: 'ui' },
  { name: 'Material UI', packages: ['@mui/material'], category: 'ui' },
  { name: 'Tailwind CSS', packages: ['tailwindcss'], category: 'ui' },
  { name: 'Chakra UI', packages: ['@chakra-ui/react'], category: 'ui' },
  { name: 'Ant Design', packages: ['antd'], category: 'ui' },
  { name: 'Tanstack Query', packages: ['@tanstack/react-query', 'react-query'], category: 'networking' },
  { name: 'SWR', packages: ['swr'], category: 'networking' },
  { name: 'Axios', packages: ['axios'], category: 'networking' },
  { name: 'tRPC', packages: ['@trpc/client', '@trpc/server'], category: 'networking' },
  { name: 'Apollo Client', packages: ['@apollo/client'], category: 'networking' },
  { name: 'GraphQL', packages: ['graphql'], category: 'networking' },
  { name: 'Zod', packages: ['zod'], category: 'other' },
  { name: 'React Hook Form', packages: ['react-hook-form'], category: 'other' },
  { name: 'date-fns', packages: ['date-fns'], category: 'other' },
  { name: 'dayjs', packages: ['dayjs'], category: 'other' },
  { name: 'lodash', packages: ['lodash', 'lodash-es'], category: 'other' },
];

export function detectKeyDependencies(rootDir: string): DependencyInfo[] {
  const pkgContent = readFileSafe(path.join(rootDir, 'package.json'));
  if (!pkgContent) return [];

  const pkg = parseJsonSafe<PackageJson>(pkgContent);
  if (!pkg) return [];

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const results: DependencyInfo[] = [];
  const seen = new Set<string>();

  for (const dep of KEY_DEPS) {
    if (seen.has(dep.name)) continue;
    const matchedPkg = dep.packages.find(p => p in allDeps);
    if (matchedPkg) {
      seen.add(dep.name);
      const rawVersion = allDeps[matchedPkg];
      results.push({
        name: dep.name,
        version: rawVersion?.replace(/^[\^~]/, '') ?? null,
        category: dep.category,
      });
    }
  }

  return results;
}
