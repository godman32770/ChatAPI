// chat-api/controllers/chatController.js
const Conversation = require('../models/Conversation');
const User = require('../models/User'); // Import User model to update tokens

// LangChain Imports
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { BufferMemory } = require('langchain/memory');
const { RunnableSequence } = require('@langchain/core/runnables');
const { StringOutputParser } = require('@langchain/core/output_parsers');

// Initialize LangChain LLM       /
const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo", // or "gpt-4o"
  temperature: 0.7,
});

// Define a prompt template for general conversations     /-
const chatPrompt = ChatPromptTemplate.fromMessages([
  new SystemMessage("You are a helpful, friendly, and concise AI assistant. Provide direct answers and keep responses brief."),
  new MessagesPlaceholder("history"), // This will hold previous messages
  ["human", "{input}"],              // Current user input
]);

exports.sendMessage = async (req, res) => {
  const { conversationId, message } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Ensure tokens field exists and is a number, initialize if not
    if (typeof user.tokens !== 'number' || user.tokens === null) {
      console.warn(`User ${userId} had invalid or missing token balance. Initializing to 100000.`);
      user.tokens = 100000;
      await user.save();
    }

    let conversation;
    let loadedMessages = [];

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.userId.toString() !== userId) {
        return res.status(404).json({ msg: 'Conversation not found or unauthorized' });
      }
      // Load existing messages into LangChain format     /-
      loadedMessages = conversation.messages.map(msg =>
        msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
      );
    } else {
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50) + '...'
      });
    }

    // Initialize BufferMemory with loaded messages     /-
    const memory = new BufferMemory({
      chatHistory: {
        getMessages: async () => loadedMessages,
        addMessage: async (message) => { /* messages are added to mongoDB below */ }
      },
      returnMessages: true,
      memoryKey: "history",
    });

    // Create the LangChain sequence
    // The chain will automatically handle memory if `memory` is passed as a key      /-
    const chain = RunnableSequence.from([
      chatPrompt,
      model,
      new StringOutputParser(),
    ]);

    // Construct input for the chain including current message and memory
    const chainInput = {
      input: message,
      history: await memory.chatHistory.getMessages(), // Pass existing messages from DB to history placeholder
    };

    // Before calling the chain, check token balance.
    // This is a pre-emptive check; actual usage is from chain response.
    const estimatedTokensForExchange = 200; // Adjust based on expected prompt + completion
    if (user.tokens < estimatedTokensForExchange) {
        return res.status(403).json({ msg: 'Insufficient tokens. Please top up your balance.', remainingTokens: user.tokens });
    }

    // Invoke the LangChain chain
    const aiResponse = await chain.invoke(chainInput, {
        callbacks: [
            {
                handleLLMEnd(output) {
                    // This callback captures token usage after the LLM call
                    const tokenInfo = output.llmOutput?.tokenUsage;
                    if (tokenInfo && tokenInfo.totalTokens) {
                        req.tokensUsedInChain = tokenInfo.totalTokens;
                    }
                },
            },
        ],
    });

    const tokensUsedInRequest = req.tokensUsedInChain || 0; // Retrieve tokens used from callback

    // Update user's token balance
    user.tokens -= tokensUsedInRequest;
    await user.save();

    // Add user and AI messages to conversation history
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    conversation.updatedAt = Date.now();

    await conversation.save();

    res.json({
      message: aiResponse,
      conversationId: conversation._id,
      tokensUsed: tokensUsedInRequest,
      remainingTokens: user.tokens
    });

  } catch (err) {
    console.error("Error in sendMessage:", err);
    // Specific error handling for LangChain/OpenAI errors
    if (err.name === 'APIError' || err.name === 'RateLimitError') {
      return res.status(err.status || 500).json({ msg: err.message, type: err.name });
    }
    res.status(500).send('Server error');
  }
};




exports.getConversationHistory = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.userId.toString() !== userId) {
      return res.status(404).json({ msg: 'Conversation not found or unauthorized' });
    }

    // Transform the conversation object to match the desired output
    const formattedConversation = {
      id: conversation._id,
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString() // Ensure ISO string format for timestamp
      }))
    };

    res.json({ conversation: formattedConversation }); // Wrap in 'conversation' key
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.listConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find all conversations for the user
    // We need to fetch the 'messages' array to get the last message content
    const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });

    // Format the conversations to match the desired output
    const formattedConversations = conversations.map(conv => {
      const lastMessage = conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1].content // Get the content of the last message
        : ''; // Or null, or a default string if no messages

      return {
        id: conv._id,
        lastMessage: lastMessage,
        updatedAt: conv.updatedAt.toISOString()
      };
    });

    res.json({ conversations: formattedConversations }); // Wrap in 'conversations' key
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
