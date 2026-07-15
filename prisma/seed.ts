import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
	const warehouse = await db.warehouse.upsert({
		where: { id: "seed-warehouse-pusat" },
		update: {},
		create: {
			id: "seed-warehouse-pusat",
			name: "Gudang Pusat",
			address: "Bandung, Jawa Barat",
		},
	});

	const admin = await db.user.upsert({
		where: { email: "admin@pharmasync.local" },
		update: {},
		create: {
			name: "Admin Utama",
			email: "admin@pharmasync.local",
			passwordHash: "belum-diimplementasi",
			role: "ADMIN",
		},
	});

	console.log({ warehouse, admin });
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
		process.exit(0);
	});
