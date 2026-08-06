import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";

export async function loadProdEnv() {
  if (process.env.NODE_ENV === "development") return;

  const client = new SSMClient({ region: "ap-northeast-2" });
  let nextToken: string | undefined;

  do {
    const resp = await client.send(
      new GetParametersByPathCommand({
        Path: "/jubabi/prod/",
        WithDecryption: true,
        Recursive: true,
        NextToken: nextToken,
      })
    );

    resp.Parameters?.forEach((p) => {
      if (!p?.Name || !p.Value) return;

      const key = p.Name.split("/").pop();
      if (key) process.env[key] = p.Value;
    });

    nextToken = resp.NextToken;
  } while (nextToken);

  const required = [
    "NEON_DATABASE_URL",
    "DART_API_KEY",
    "JWT_SECRET",
    "KAKAO_REST_API_KEY",
    "KAKAO_CLIENT_SECRET",
    "KAKAO_ADMIN_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing config from SSM: ${missing.join(", ")}`);
  }
}
