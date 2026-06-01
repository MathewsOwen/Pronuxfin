export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const email =
    process.env.SECURITY_CONTACT_EMAIL?.trim() || "security@pronuxfin.com.br";
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

  const lines = [
    "Contact: mailto:" + email,
    "Preferred-Languages: pt-BR, en",
    "Canonical: https://securitytxt.org/",
  ];
  if (site) {
    lines.push(`Policy: ${site}/termos`);
    lines.push(`Policy: ${site}/privacidade`);
  }

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
