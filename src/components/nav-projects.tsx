"use client";

import { usePathname } from "next/navigation";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
	name: string;
	url: string;
	icon: React.ReactNode;
}

interface NavGroup {
	label: string;
	items: NavItem[];
}

export function NavProjects({ groups }: { groups: NavGroup[] }) {
	const pathname = usePathname();

	return (
		<>
			{groups.map((group) => (
				<SidebarGroup key={group.label}>
					<SidebarGroupLabel className="text-xs font-bold tracking-wider text-slate-500! uppercase px-2">
						{group.label}
					</SidebarGroupLabel>
					<SidebarMenu className="gap-1">
						{group.items.map((item) => {
							const isActive =
								pathname === item.url || pathname.startsWith(`${item.url}/`);
							return (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton
										tooltip={item.name}
										isActive={isActive}
										className={
											isActive
												? "bg-primary! text-primary-foreground! hover:bg-primary! hover:text-primary-foreground! font-semibold"
												: "text-slate-700! hover:bg-primary/10! hover:text-primary! font-medium"
										}
										render={<a href={item.url} />}>
										{item.icon}
										<span>{item.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			))}
		</>
	);
}
