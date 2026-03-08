import { TaskConfig } from "./types";

export const TASK_CONFIGS: TaskConfig[] = [
  {
    id: 'brainstorm',
    label: 'Brainstorm Mechanics',
    icon: 'Lightbulb',
    prompt: 'I need some unique game mechanic ideas for a [GENRE] game. Can you brainstorm 3-5 innovative concepts?'
  },
  {
    id: 'code',
    label: 'Generate Code',
    icon: 'Code',
    prompt: 'Write a [LANGUAGE/ENGINE] script for [FEATURE]. Please include comments explaining the logic.'
  },
  {
    id: 'debug',
    label: 'Debug & Optimize',
    icon: 'Bug',
    prompt: 'I have this code snippet that is [ERROR/SLOW]. Can you help me fix or optimize it?\n\n```\n[CODE]\n```'
  },
  {
    id: 'level',
    label: 'Level Design',
    icon: 'Map',
    prompt: 'Help me design a level for a [GENRE] game. What should be the key beats, hazards, and rewards?'
  },
  {
    id: 'math',
    label: 'Math & Physics',
    icon: 'Calculator',
    prompt: 'What is the formula for [PHYSICS/MATH PROBLEM] in game development? Show me how to implement it.'
  },
  {
    id: 'planning',
    label: 'Project Planning',
    icon: 'ClipboardList',
    prompt: 'Create a milestone breakdown for a [GAME TYPE] project that I want to build in [TIMEFRAME].'
  },
  {
    id: 'video',
    label: 'Video Architect',
    icon: 'Video',
    prompt: 'Generate a cinematic 5-second video for [SCENE DESCRIPTION]. Use 720p resolution and 16:9 aspect ratio.'
  }
];

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'rpg-core',
    name: 'RPG Core Systems',
    description: 'Define stats, classes, and combat mechanics for an RPG.',
    icon: 'Sword',
    prompt: 'I want to design a core RPG system. Let\'s start by defining the primary attributes (like Strength, Agility), a basic class system, and how damage is calculated in combat.'
  },
  {
    id: 'platformer-feel',
    name: 'Platformer "Juice"',
    description: 'Focus on movement, physics, and game feel.',
    icon: 'Pickaxe',
    prompt: 'Help me design the movement mechanics for a 2D platformer. I want to focus on "juice" - things like coyote time, jump buffering, and variable jump height. What are the ideal values and logic for these?'
  },
  {
    id: 'horror-atmosphere',
    name: 'Horror Atmosphere',
    description: 'Design tension, lighting, and sound for horror games.',
    icon: 'Bug',
    prompt: 'I\'m building a horror game. Help me design a template for creating tension. Focus on environmental storytelling, lighting cues, and how to use sound to keep the player on edge.'
  },
  {
    id: 'economy-sim',
    name: 'Economy & Crafting',
    description: 'Balance resources, trading, and crafting recipes.',
    icon: 'Hammer',
    prompt: 'Let\'s design a crafting and economy system for a survival game. We need to define base resources, how they combine into advanced items, and how to prevent inflation in a player-driven market.'
  },
  {
    id: 'narrative-branching',
    name: 'Branching Narrative',
    description: 'Map out story choices and character relationships.',
    icon: 'ClipboardList',
    prompt: 'I need a narrative template for a branching dialogue system. Help me map out a major choice in my game, its immediate consequences, and how it affects the long-term relationship with a key NPC.'
  },
  {
    id: 'roguelike-loop',
    name: 'Roguelike Loop',
    description: 'Design procedural generation and meta-progression.',
    icon: 'Layers',
    prompt: 'Help me design the core loop for a roguelike. We need to define what stays with the player after death (meta-progression) and how the procedural room generation should prioritize variety.'
  }
];
