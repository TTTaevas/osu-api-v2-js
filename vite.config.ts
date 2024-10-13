import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
	typecheck: {
		enabled: true,
		include: ["lib/tests/*.test.ts"],
		tsconfig: 'tsconfig.json'
	}
  }
})
