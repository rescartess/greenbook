import "server-only";
import type { Collection } from "@/core/config/practice";
import type { SubjectSlug } from "@/core/config/subjects";
import { createDbClient } from "@/core/db/server";
import { parseTopic, parseTopics, type TopicDetail, type TopicSummary } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every topic of a subject in one collection, with its question counts and the student's progress. */
export async function listTopics(subject: SubjectSlug, collection: Collection): Promise<TopicSummary[]> {
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("list_topics", { p_subject: subject, p_collection: collection });
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return parseTopics(data);
}

/** One topic's setup page. Null when it doesn't exist or isn't published yet. */
export async function getTopic(setId: string): Promise<TopicDetail | null> {
  if (!UUID.test(setId)) return null;
  const supabase = await createDbClient();
  const { data, error } = await supabase.rpc("get_topic", { p_set_id: setId });
  if (error) {
    if (error.code === "P0002") return null;
    throw new Error(`Could not load the topic: ${error.message}`);
  }
  return parseTopic(data);
}
