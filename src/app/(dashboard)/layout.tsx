import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex flex-col flex-1 w-full overflow-x-hidden bg-white">
				<div className="p-4 border-b bg-white flex items-center gap-2 h-14 shrink-0">
					<SidebarTrigger />
				</div>

				<div className="flex-1 overflow-y-auto">{children}</div>
			</main>
		</SidebarProvider>
	);
}
