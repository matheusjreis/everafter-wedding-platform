import { expect, test } from "@playwright/test";

test("a página inicial apresenta a landing de fundação", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sua história de amor merece um lugar bonito." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar meu site de casamento" }).first()).toBeVisible();
});
