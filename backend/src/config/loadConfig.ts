import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";

export async function loadProdEnv() {
  if (process.env.NODE_ENV === "development") return;

  const client = new SSMClient({ region: "ap-northeast-2" });

  const command = new GetParametersByPathCommand({
    Path: "/jubabi/prod/",
    WithDecryption: true,
  });

  const resp = await client.send(command);

  resp.Parameters?.forEach((p) => {
    if (!p?.Name || !p.Value) return;

    const key = p.Name.split("/").pop();
    if (key && p.Value) process.env[key] = p.Value;
  });
}
