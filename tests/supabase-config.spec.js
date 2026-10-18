import { test, expect } from "@playwright/test";
import { getSupabaseConfig } from "../lib/supabase/config";

const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
let original;

test.beforeEach(() => {
  original = Object.fromEntries(names.map(name => [name, process.env[name]]));
  names.forEach(name => delete process.env[name]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
});

test.afterEach(() => {
  names.forEach(name => {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  });
});

test("aceita a chave com o nome ANON_KEY", () => {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  expect(getSupabaseConfig().key).toBe("anon-test-key");
});

test("aceita somente PUBLISHABLE_KEY, como no projeto já configurado", () => {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
  expect(getSupabaseConfig().key).toBe("publishable-test-key");
});

test("prioriza ANON_KEY quando as duas existem", () => {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
  expect(getSupabaseConfig().key).toBe("anon-test-key");
});

test("rejeita configuração sem chave ou sem URL", () => {
  expect(() => getSupabaseConfig()).toThrow("Configure NEXT_PUBLIC_SUPABASE_URL");
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-test-key";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  expect(() => getSupabaseConfig()).toThrow("Configure NEXT_PUBLIC_SUPABASE_URL");
});
