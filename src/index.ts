import express, { Express, Request, Response } from "express";
import knex, { Knex } from "knex";

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./db/transponders.db",
  },
  useNullAsDefault: true,
});

const app: Express = express();
const port = 8000;

const dbData = async (dbName: string) => {
  return await db.from(dbName).select("*");
};

app.use(express.json());

app.get("/transponders", async (req, res) => {
  const transponders = await dbData("transponders");
  const relations = await dbData("transponder_relations");
  var transpondersMap: any = {},
    parentMap: any = {};
  for (var i = 0; i < transponders.length; i++) {
    const obj = transponders[i];
    obj.children = [];

    transpondersMap[obj.id] = obj;
  }

  for (var i = 0; i < relations.length; i++) {
    const { childId, parentId } = relations[i];
    const parent = transpondersMap[parentId];
    const child = transpondersMap[childId];
    parent.children.push(child);
    parentMap[childId] = true;
  }

  const result = [];
  for (var i = 0; i < transponders.length; i++) {
    const { id } = transponders[i];

    // root if parent doesn't exist
    if (!parentMap[id]) {
      result.push(transpondersMap[id]);
    }
  }

  res.status(200).json({ transponders: result });
});

app.get("/count/:id?", async (req, res) => {
  const id = req.params.id;
  let count = 0;
  if (!id) {
    let counts: any = await db
      .from("transponders")
      .count("id", { as: "count" })
      .first();
    count = counts["count"];
  } else {
    let counts: any = await db
      .from("transponder_relations")
      .where({ parentId: id })
      .count("id", { as: "count" })
      .first();
    count = counts["count"];
  }
  res.status(200).json({ counts: count });
});

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
