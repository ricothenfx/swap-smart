import { test, expect } from "@playwright/test"

test("picker golden path: OOS moment → swap → message → summary", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /5-second shelf decision/i })).toBeVisible()

  await page.getByRole("button", { name: "Start picking" }).click()
  await expect(page.locator("button[data-current='true']")).toBeVisible()
  await page.waitForTimeout(400)

  // Tap the current (highlighted) item until the OOS panel appears —
  // deterministic: seed 2026 order 1 contains an out-of-stock Gouda.
  const oosPanel = page.getByTestId("oos-panel")
  for (let i = 0; i < 12; i++) {
    if (await oosPanel.isVisible()) break
    await page.locator("button[data-current='true']").click()
    await page.waitForTimeout(400)
  }
  await expect(oosPanel).toBeVisible()
  await expect(page.getByText("OUT OF STOCK", { exact: false }).first()).toBeVisible()

  // engine thinking → candidate cards with reasons
  await expect(page.getByText("Engine suggestions").or(page.getByText(/no safe substitute/i))).toBeVisible({
    timeout: 5_000,
  })
  const swapBtn = page.getByRole("button", { name: /swap with this/i }).first()
  if (await swapBtn.isVisible().catch(() => false)) {
    // explainability: open the Why? breakdown
    await page.getByRole("button", { name: "Why?" }).first().click()
    await expect(page.getByText("Score breakdown")).toBeVisible()
    await page.getByRole("button", { name: /hide/i }).first().click()

    await swapBtn.click()
    await expect(page.getByText("Customer message")).toBeVisible()
    await expect(page.getByText(/We swapped your/i)).toBeVisible()

    // multilingual: switch to German, message changes
    await page.getByRole("button", { name: "DE", exact: true }).click()
    await expect(page.getByText(/Wir haben/i)).toBeVisible()

    await page.getByRole("button", { name: /send & continue/i }).click()
  } else {
    // no safe substitute: honest refund path
    await page.getByRole("button", { name: /refund/i }).first().click()
  }

  // finish the order by picking the rest (clicks race exit animations — retry loop)
  for (let i = 0; i < 20; i++) {
    if (await page.getByText("Order done").isVisible().catch(() => false)) break
    const current = page.locator("button[data-current='true']")
    if (!(await current.isVisible().catch(() => false))) {
      await page.waitForTimeout(300)
      continue
    }
    await current.click({ timeout: 2500 }).catch(() => {})
    await page.waitForTimeout(350)
    const refund = page.getByRole("button", { name: /refund/i }).first()
    if (await refund.isVisible().catch(() => false)) {
      await refund.click({ timeout: 2500 }).catch(() => {})
    }
  }
  await expect(page.getByText("Order done")).toBeVisible({ timeout: 5000 })
})

test("ops deck: KPIs, twin replay, explorer", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("navigation").getByRole("button", { name: "Ops Deck" }).click()
  await expect(page.getByRole("heading", { name: "Ops Deck" })).toBeVisible()
  await expect(page.getByText("Net impact")).toBeVisible()
  await expect(page.getByText("Twin replay")).toBeVisible()
  await expect(page.getByText("Substitution explorer")).toBeVisible()

  // explorer: vegan household must not see dairy suggestions for milk —
  // blocked candidates live inside a <details>, open it first
  await page.getByRole("button", { name: "Vegan household" }).click()
  const details = page.getByText(/blocked candidates — inspect the hard rules/).first()
  if (await details.isVisible().catch(() => false)) {
    await details.click()
    await expect(page.getByText(/Not vegan — this basket is vegan/).first()).toBeVisible()
  } else {
    await expect(page.getByText(/No safe substitute under the hard rules/)).toBeVisible()
  }
})

test("story tab renders the proof table", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("navigation").getByRole("button", { name: "Story" }).click()
  await expect(page.getByText("The honesty section")).toBeVisible()
  await expect(page.getByRole("table").first()).toBeVisible()
})

test("qa tab renders both sections and links back", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("navigation").getByRole("button", { name: "Q&A" }).click()
  await expect(page.getByRole("heading", { name: "For non-technical reviewers" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "For technical reviewers" })).toBeVisible()

  const item = page.getByTestId("qa-item").first()
  await item.locator("summary").click()
  await expect(item.locator("div")).toBeVisible()

  await page.getByRole("button", { name: "back to the app" }).click()
  await expect(page.getByRole("heading", { name: /5-second shelf decision/i })).toBeVisible()
})

test("theme toggle flips the document theme", async ({ page }) => {
  await page.goto("/")
  const before = await page.locator("html").getAttribute("data-theme")
  await page.getByRole("button", { name: /mode/i }).click()
  const after = await page.locator("html").getAttribute("data-theme")
  expect(after).not.toBe(before)
})

test("golden demo opens and advances", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /golden demo/i }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByText(/Friday, 17:42/)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()
  await expect(page.getByText(/milk is gone/i)).toBeVisible()
  await page.getByRole("button", { name: "Close" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()
})
