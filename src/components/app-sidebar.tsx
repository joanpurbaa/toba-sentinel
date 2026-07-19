"use client";

import * as React from "react";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarRail,
} from "@/components/ui/sidebar";

import {
	LayoutDashboard,
	Truck,
	History,
	Users,
	Hospital,
	Box,
	SparklesIcon,
  MapPinned,
} from "lucide-react";

const defaultNavGroups = [
	{
		label: "Operasional",
		items: [
			{ name: "Dashboard", url: "/dashboard", icon: <LayoutDashboard /> },
			{ name: "Tempat", url: "/tempat", icon: <MapPinned /> },
			// { name: "Distribusi", url: "/distribusi", icon: <Truck /> },
			// { name: "Petugas", url: "/petugas", icon: <Users /> },
		],
	},
	// {
	// 	label: "Manajemen Data",
	// 	items: [
	// 		{ name: "Mitra", url: "/mitra", icon: <Hospital /> },
	// 		{ name: "Riwayat", url: "/riwayat", icon: <History /> },
	// 		{ name: "Visualisasi 3D", url: "/warehouse", icon: <Box /> },
	// 	],
	// },
	// {
	// 	label: "Asisten AI",
	// 	items: [
	// 		{
	// 			name: "Chat Pharmasync AI",
	// 			url: "https://t.me/PharmasyncBot",
	// 			icon: <SparklesIcon />,
	// 			external: true,
	// 			accent: true,
	// 		},
	// 	],
	// },
];

const driverNavGroups = [
	{
		label: "Tugas Lapangan",
		items: [{ name: "Dashboard", url: "/driver", icon: <LayoutDashboard /> }],
	},
];

type User = {
	name: string;
	email: string;
	avatar: string;
};

function StaticNavPlaceholder() {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{Array.from({ length: 5 }).map((_, idx) => (
					<SidebarMenuItem key={idx}>
						<div className="flex h-8 items-center gap-2 rounded-md px-2">
							<div className="size-4 shrink-0 rounded-md bg-slate-100" />
							<div className="h-4 w-2/3 rounded-md bg-slate-100" />
						</div>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

function AnimatedNavSkeleton() {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{Array.from({ length: 5 }).map((_, idx) => (
					<SidebarMenuItem key={idx}>
						<SidebarMenuSkeleton showIcon />
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [user, setUser] = React.useState<User>({
		name: "Memuat...",
		email: "",
		avatar: "",
	});

	const [userRole, setUserRole] = React.useState<string | null>(null);
	const [isRoleLoading, setIsRoleLoading] = React.useState(true);
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	React.useEffect(() => {
		const fetchUserAndRole = async () => {
			try {
				const res = await fetch("/api/auth/me", {
					credentials: "include",
					cache: "no-store",
				});

				if (!res.ok) return;

				const data = await res.json();

				setUser({
					name: data.name,
					email: data.email,
					avatar: "",
				});

				if (data.role) {
					setUserRole(data.role.toUpperCase());
				}
			} catch (err) {
				console.error("Gagal memuat profil & role di sidebar:", err);
			} finally {
				setIsRoleLoading(false);
			}
		};

		fetchUserAndRole();
	}, []);

	const activeNavGroups =
		userRole === "DRIVER" ? driverNavGroups : defaultNavGroups;

	let navContent: React.ReactNode;
	if (!mounted) {
		navContent = <StaticNavPlaceholder />;
	} else if (isRoleLoading) {
		navContent = <AnimatedNavSkeleton />;
	} else {
		navContent = <NavProjects groups={activeNavGroups} />;
	}

	return (
		<Sidebar
			collapsible="icon"
			className="bg-white border-r border-slate-200 text-slate-900"
			{...props}>
			<SidebarHeader className="bg-white border-b border-slate-100">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="hover:bg-transparent cursor-default">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0 shadow-sm">
								<img
									src="/icon.svg"
									alt="Pharmasync Icon"
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold text-slate-900">
									Pharmasync
								</span>
								<span className="truncate text-xs text-slate-500">Supply Chain</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="bg-white text-slate-900">
				{navContent}
			</SidebarContent>

			<SidebarFooter className="bg-white border-t border-slate-100">
				<NavUser user={user} />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
