/**
 * Seed des articles blog CMS.
 * Usage : pnpm tsx scripts/seed-blog-articles.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { BLOG_ARTICLES_SEED } from '../src/lib/blog-articles-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed des articles blog CMS...\n');

  let created = 0;
  let updated = 0;

  for (const article of BLOG_ARTICLES_SEED) {
    const existing = await prisma.blogArticle.findUnique({ where: { slug: article.slug } });

    const data = {
      titleFr: article.titleFr,
      titleEn: article.titleEn,
      titleCn: article.titleCn ?? null,
      summaryFr: article.summaryFr,
      summaryEn: article.summaryEn,
      summaryCn: article.summaryCn ?? null,
      contentFr: article.contentFr,
      contentEn: article.contentEn,
      contentCn: article.contentCn ?? null,
      category: article.category,
      readTimeMinutes: article.readTimeMinutes,
      isFeatured: article.isFeatured,
      publishedAt: new Date(article.publishedAt),
      isPublished: true,
      sortOrder: article.sortOrder,
    };

    if (existing) {
      await prisma.blogArticle.update({ where: { slug: article.slug }, data });
      updated++;
      console.log(`  ↻ Mis à jour : ${article.slug}`);
    } else {
      await prisma.blogArticle.create({ data: { slug: article.slug, ...data } });
      created++;
      console.log(`  ✓ Créé : ${article.slug}`);
    }
  }

  console.log(`\n✅ Terminé : ${created} créé(s), ${updated} mis à jour.`);
}

main()
  .catch((error) => {
    console.error('Erreur seed blog:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
