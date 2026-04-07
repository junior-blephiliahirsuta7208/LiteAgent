type QuestionLike = {
  question(prompt: string): Promise<string>;
};

export async function readPrompt(rl: QuestionLike, prompt: string): Promise<string | null> {
  try {
    return await rl.question(prompt);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ERR_USE_AFTER_CLOSE") {
      return null;
    }

    throw error;
  }
}
