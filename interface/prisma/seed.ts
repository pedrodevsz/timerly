import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient, SessionStatus } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL não está configurada.");

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });
const seedUserId = "00000000-0000-4000-8000-000000000001";

const projects = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "ENEM 2027",
    description: "Preparação completa para a prova, com foco nos conteúdos de maior incidência.",
    subjects: [
      {
        name: "Matemática",
        topics: [
          "Funções quadráticas",
          "Análise combinatória",
          "Geometria espacial",
          "Probabilidade",
        ],
      },
      { name: "Biologia", topics: ["Ecologia", "Genética mendeliana", "Fisiologia humana", "Evolução"] },
      { name: "Linguagens", topics: ["Interpretação textual", "Figuras de linguagem", "Literatura brasileira"] },
      { name: "História", topics: ["Brasil República", "Era Vargas", "Guerra Fria"] },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Inglês · C1",
    description: "Vocabulário, conversação e preparação para o exame de proficiência.",
    subjects: [{ name: "English", topics: ["Advanced vocabulary", "Speaking", "Essay writing"] }],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Cálculo I",
    description: "Limites, derivadas e integrais — revisão para o próximo semestre.",
    subjects: [{ name: "Cálculo", topics: ["Limites", "Derivadas", "Integrais"] }],
  },
];

async function main() {
  await prisma.user.upsert({
    where: { id: seedUserId },
    update: {},
    create: {
      id: seedUserId,
      name: "Pedro Santos",
      email: "legacy@orbe.invalid",
      passwordHash: null,
    },
  });

  await prisma.userSettings.upsert({
    where: { id: "local" },
    update: { userId: seedUserId },
    create: { id: "local", userId: seedUserId, name: "Pedro Santos", email: "legacy@orbe.invalid" },
  });

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: { name: project.name, description: project.description, userId: seedUserId },
      create: { id: project.id, name: project.name, description: project.description, userId: seedUserId },
    });
    for (const subject of project.subjects) {
      const savedSubject = await prisma.subject.upsert({
        where: { projectId_name: { projectId: project.id, name: subject.name } },
        update: {},
        create: { projectId: project.id, name: subject.name },
      });
      for (const [index, topicName] of subject.topics.entries()) {
        await prisma.topic.upsert({
          where: { subjectId_name: { subjectId: savedSubject.id, name: topicName } },
          update: {},
          create: { subjectId: savedSubject.id, name: topicName, completed: index < 2 },
        });
      }
    }
  }

  const existingSessions = await prisma.studySession.count({ where: { userId: seedUserId } });
  if (existingSessions === 0) {
    const topics = await prisma.topic.findMany({
      where: { subject: { projectId: projects[0].id } },
      include: { subject: true },
    });
    const durations = [6120, 3480, 4680, 2760, 5400, 3900, 7200, 3000, 4440, 5100, 2700, 6300];
    const topicOrder = [
      "Funções quadráticas",
      "Genética mendeliana",
      "Interpretação textual",
      "Brasil República",
    ];
    for (let dayOffset = 0; dayOffset < durations.length; dayOffset++) {
      const topic = topics.find((item) => item.name === topicOrder[dayOffset % topicOrder.length]);
      if (!topic) continue;
      const endedAt = new Date();
      endedAt.setDate(endedAt.getDate() - dayOffset);
      endedAt.setHours(9 + (dayOffset % 4) * 3, 0, 0, 0);
      const startedAt = new Date(endedAt.getTime() - durations[dayOffset] * 1000);
      await prisma.studySession.create({
        data: {
          userId: seedUserId,
          topicId: topic.id,
          startedAt,
          endedAt,
          lastTransitionAt: endedAt,
          durationSeconds: durations[dayOffset],
          status: SessionStatus.COMPLETED,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
