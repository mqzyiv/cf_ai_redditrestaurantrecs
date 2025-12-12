/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { streamText, tool, type ToolSet } from "ai";
import { z } from "zod/v3";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { scheduleSchema } from "agents/schedule";

const scheduleTask = tool({
  description: "A tool to schedule a task to be executed at a later time",
  inputSchema: scheduleSchema,
  execute: async ({ when, description }) => {
    // we can now read the agent context from the ALS store
    const { agent } = getCurrentAgent<Chat>();

    function throwError(msg: string): string {
      throw new Error(msg);
    }
    if (when.type === "no-schedule") {
      return "Not a valid schedule input";
    }
    const input =
      when.type === "scheduled"
        ? when.date // scheduled
        : when.type === "delayed"
          ? when.delayInSeconds // delayed
          : when.type === "cron"
            ? when.cron // cron
            : throwError("not a valid schedule input");
    try {
      agent!.schedule(input!, "executeTask", description);
    } catch (error) {
      console.error("error scheduling task", error);
      return `Error scheduling task: ${error}`;
    }
    return `Task scheduled for type "${when.type}" : ${input}`;
  }
});

/**
 * Tool to list all scheduled tasks
 * This executes automatically without requiring human confirmation
 */
const getScheduledTasks = tool({
  description: "List all tasks that have been scheduled",
  inputSchema: z.object({}),
  execute: async () => {
    const { agent } = getCurrentAgent<Chat>();

    try {
      const tasks = agent!.getSchedules();
      if (!tasks || tasks.length === 0) {
        return "No scheduled tasks found.";
      }
      return tasks;
    } catch (error) {
      console.error("Error listing scheduled tasks", error);
      return `Error listing scheduled tasks: ${error}`;
    }
  }
});

/**
 * Tool to cancel a scheduled task by its ID
 * This executes automatically without requiring human confirmation
 */
const cancelScheduledTask = tool({
  description: "Cancel a scheduled task using its ID",
  inputSchema: z.object({
    taskId: z.string().describe("The ID of the task to cancel")
  }),
  execute: async ({ taskId }) => {
    const { agent } = getCurrentAgent<Chat>();
    try {
      await agent!.cancelSchedule(taskId);
      return `Task ${taskId} has been successfully canceled.`;
    } catch (error) {
      console.error("Error canceling scheduled task", error);
      return `Error canceling task ${taskId}: ${error}`;
    }
  }
});

/**
 * Tool for getting reddit pages for a restaurants
 */
const getRedditReccs = tool({
  description: "Look for community recommendations for restaurants in a city by looking through reddit posts, returns a descriptive list of restaurants",
  inputSchema: z.object({
    city: z.string().describe("City to look for restaurants in")
  }),
  execute: async({city},env) =>{
    const {agent} = getCurrentAgent<Chat>();
    var count  = 0
   try{
      const url = `https://www.reddit.com/search.json?q=%22best+restaurant%22+${encodeURIComponent(city)}&limit=10&type=posts&sort=relevance&t=all`
      count = 1
      const res = await fetch(url,{
        headers: {
        "User-Agent": "script by u/tea-kettle5",
        "Accept": "application/json"
        }}
      );
      const data = await res.json() as any;
      count =2
      const rlist = data.data.children.map((p: { data: { title: any; subreddit: any; id: any; }; })  => ({
        title: p.data.title.replaceAll(" ","_").toLowerCase().replace(/[^a-zA-Z0-9_\s]/g, ''),
        subreddit: p.data.subreddit,
        id: p.data.id
      }));
      
      let bodys =new Map<string,Array<String>>();
      count = 3
      for (const i of rlist){
        const url = `https://www.reddit.com/r/${i.subreddit}/comments/${i.id}/${i.title}.json?sort=top&limit=30`
        const res = await fetch(url,{
           headers: {
           "User-Agent": "script by u/tea-kettle5",
           "Accept": "application/json"
           }});
            const data = await res.json() as any;
          const arr =[data[0].data.children[0].data.selftext,data[1].data.children.slice(0,-1).map((p: { data:{body:string}; })  => (p.data.body))];
          bodys.set(i.title,arr);
      } 
      const obj = Object.fromEntries(bodys)
      const jsonString = JSON.stringify(obj)
      const response =  await agent?.runPrompt("You are a helpful assistent that can analyze and extract text from strings",
        "Examine the text and determine which 5 restaurants are mentioned weighing both by most positive mentions and return a resonse as a list"+jsonString
      );
      console.log(response);
      return response?.valueOf()
    }catch(e){
      console.error(e);
      return `error getting reddit recommendations: ${e} and ${count}`
    }
  }
});
/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  scheduleTask,
  getScheduledTasks,
  cancelScheduledTask,
  getRedditReccs
} satisfies ToolSet;

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 */
export const executions = {
  getWeatherInformation: async ({ city }: { city: string }) => {
    console.log(`Getting weather information for ${city}`);
    return `The weather in ${city} is sunny`;
  }
};
