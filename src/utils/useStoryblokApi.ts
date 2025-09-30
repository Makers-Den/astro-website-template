import type { StoryblokClient } from '@storyblok/astro';
import { useStoryblokApi } from '@storyblok/astro';

export default function patchStoryblokApiInstance(): StoryblokClient {
  const rateLimit = 25;
  const storyblokApiInstance = useStoryblokApi();

  // Type assertion to access private/internal properties that exist at runtime
  // but are not exposed in the public TypeScript interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiInstance = storyblokApiInstance as any;

  if (!apiInstance.__patched) {
    if (!apiInstance.throttledRequest) {
      throw new Error('Could not patch StoryblokApi. Expected it to have a throttledRequest field.');
    }
    apiInstance.throttle = createThrottledFunction(apiInstance.throttledRequest.bind(apiInstance), rateLimit, 1000);

    apiInstance.__patched = true;
  }
  return storyblokApiInstance;
}

function createThrottledFunction(func: (...args: unknown[]) => unknown, limit: number, intervalMs: number) {
  const queue: {
    queuedTime: Date;
    dueTime: Date;
  }[] = [];

  const throttledFunction = async (...args: unknown[]) => {
    const now = new Date();
    now.setMilliseconds(0);

    // Prune anything off the queue that should have run already
    for (let i = 0; i < queue.length; i++) {
      if (queue[i]!.dueTime < now) {
        queue.splice(i, 1);
        i--;
      }
    }

    const delayNeeded = Math.floor(queue.length / limit) * intervalMs;
    const dueTime = new Date(now.getTime() + delayNeeded);

    queue.push({
      queuedTime: now,
      dueTime,
    });

    if (delayNeeded > 0) {
      await new Promise<void>((r) => setTimeout(() => r(), delayNeeded));
    }

    const result = await func(...args);
    return result;
  };

  return throttledFunction;
}
