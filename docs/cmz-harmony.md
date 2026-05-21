# CMZ Harmony Document

This document outlines how the CMZ agent interacts with supplementary external repositories to ensure a harmonious and non-redundant automation ecosystem.

## Supplementary Repositories

1. **oh-my-opencode**: Provides standardized CLI enhancements and shell aliases used by CMZ for efficient workspace navigation.
2. **opencode-antigravity-auth**: Manages authentication tokens and secure session persistence for agent-to-tool communications.
3. **AI-Agents-public**: Source for standardized git commit message templates and common agentic skills.
4. **superpowers**: Enhances the agent's debugging capabilities with advanced system-level diagnostic tools.
5. **system_prompts_leaks**: Used as a security reference to harden the agent against prompt injection and information disclosure.
6. **UltraRAG**: Provides the Retrieval-Augmented Generation framework used by CMZ for deep codebase understanding and context engineering.

## Harmony Principles

- **No Conflict**: Each repository serves a distinct domain (Auth, Debugging, Knowledge, etc.).
- **Integration**: CMZ uses the tools from these repositories via the SkillHub registry.
- **Maintenance**: Skills are updated periodically via the `opencode run` update cycles.
