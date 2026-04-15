import express from "express";
import { searchCompanies } from "../utils/companySearch";
import { companiesCache } from "../cache/companiesCache";

const router = express.Router();

router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({
      error: "Missing query parameter `q`",
    });
  }

  try {
    const results = searchCompanies(q);

    if (results.length === 0) {
      return res.json([]);
    }

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/lookup", async (req, res) => {
  const { corpCode } = req.query;

  if (typeof corpCode !== "string" || corpCode.trim() === "") {
    return res.status(400).json({ error: "corpCode 필요" });
  }

  try {
    const company = companiesCache.getByCorpCode(corpCode);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
