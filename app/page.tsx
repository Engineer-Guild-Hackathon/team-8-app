import Hero from '@/components/hero';
import ConnectSupabaseSteps from '@/components/tutorial/connect-supabase-steps';
import SignUpUserSteps from '@/components/tutorial/sign-up-user-steps';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
      </main>
    </>
  );
}

// UI Components確認用
// 'use client';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   CardFooter,
// } from '@/components/ui/card';
// import {
//   Tabs,
//   TabsList,
//   TabsTrigger,
//   TabsContent,
// } from '@/components/ui/tabs';
// import {
//   Drawer,
//   DrawerTrigger,
//   DrawerContent,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerDescription,
// } from '@/components/ui/drawer';

// export default function Home() {
//   return (
//     <div className="p-6 space-y-8">
//       <h1 className="text-2xl font-bold">UI Components Preview</h1>

//       {/* Buttons */}
//       <div className="space-x-2">
//         <Button variant="default">Default</Button>
//         <Button variant="secondary">Secondary</Button>
//         <Button variant="outline">Outline</Button>
//         <Button variant="ghost">Ghost</Button>
//       </div>

//       {/* Input */}
//       <div>
//         <Input placeholder="Type something..." />
//       </div>

//       {/* Card */}
//       <Card className="w-80">
//         <CardHeader>
//           <CardTitle>Sample Card</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-sm text-muted-foreground">
//             Card body content goes here.
//           </p>
//         </CardContent>
//         <CardFooter>
//           <Button>Action</Button>
//         </CardFooter>
//       </Card>

//       {/* Tabs */}
//       <Tabs defaultValue="list">
//         <TabsList>
//           <TabsTrigger value="list">List</TabsTrigger>
//           <TabsTrigger value="graph">Graph</TabsTrigger>
//         </TabsList>
//         <TabsContent value="list">
//           <p>List view content</p>
//         </TabsContent>
//         <TabsContent value="graph">
//           <p>Graph view content</p>
//         </TabsContent>
//       </Tabs>

//       {/* Drawer */}
//       <Drawer>
//         <DrawerTrigger asChild>
//           <Button>Open Drawer</Button>
//         </DrawerTrigger>
//         <DrawerContent>
//           <DrawerHeader>
//             <DrawerTitle>Drawer title</DrawerTitle>
//             <DrawerDescription>
//               Drawer description here.
//             </DrawerDescription>
//           </DrawerHeader>
//         </DrawerContent>
//       </Drawer>
//     </div>
//   );
// }
