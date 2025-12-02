This is an fork of cloudflare's Agent-Starter. It is powered by Workers AI and the model "@cf/meta/llama-3.2-3b-instruct" and "@cf/meta/llama-3.3-70b-instruct-fp8-fast". 
The tool I added scrapes reddit posts and comments for a specific city and leverages AI to extract restaurant names and sentiment towards those restaurants. The model then returns the restaurants with the most positive mentions. The tool takes in a string for a city name and returns a Promise<string> which, if successful contains the top 5 restaurants found. If the call is unsuccessful, the error is printed.   

The tools querys reddit using `https://www.reddit.com/search.json` and gets the top 10 posts. Then the tool takes the top 30 comments in each post and appends it to an array. The llama 3.3 model then takes in the array and determines which restaurants have the most positive mentions and returns the top 5. 
This tool is limited by what I can fetch off of reddits json api and tends to run very slowly each time it is called. In the future I hope to use playwright or puppeteer to get more accurate reddit reccommendations and implement caching to maintain a persistent database of restaurants for the agent to pull from. 

An active version of this project is available at https://agents.mqzyiv.workers.dev
