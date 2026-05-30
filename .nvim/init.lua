vim.g.project_formatter = "oxfmt"

vim.lsp.enable("oxfmt")

local dap = require("dap")
local mason_registry = require("mason-registry")

-- ensure js-debug-adapter is installed
local ok, js_debug = pcall(mason_registry.get_package, "js-debug-adapter")
if not ok or not js_debug:is_installed() then
	vim.notify("run :MasonInstall js-debug-adapter", vim.log.levels.WARN)
	return
end

local js_debug_path = js_debug:get_install_path()

-- adapter config (2026 best practice)
dap.adapters["pwa-node"] = {
	type = "server",
	host = "127.0.0.1",
	port = "${port}",
	executable = {
		command = "node",
		args = {
			js_debug_path .. "/js-debug/src/dapDebugServer.js",
			"${port}",
			"127.0.0.1",
		},
	},
}

-- configurations for TypeScript/JavaScript
for _, lang in ipairs({ "typescript", "javascript", "typescriptreact", "javascriptreact" }) do
	dap.configurations[lang] = {
		{
			name = "Attach (bun dev:debug)",
			type = "pwa-node",
			request = "attach",
			port = 9229,
			restart = true,
			sourceMaps = true,
			resolveSourceMapLocations = {
				"${workspaceFolder}/**",
				"!**/node_modules/**",
			},
			localRoot = vim.fn.getcwd(),
			remoteRoot = vim.fn.getcwd(),
			skipFiles = { "<node_internals>/**" },
		},
		{
			name = "Launch (bun vite dev)",
			type = "pwa-node",
			request = "launch",
			runtimeExecutable = "bun",
			runtimeArgs = { "--inspect=9229", "vite", "dev", "--port", "3000" },
			port = 9229,
			sourceMaps = true,
			resolveSourceMapLocations = {
				"${workspaceFolder}/**",
				"!**/node_modules/**",
			},
			cwd = vim.fn.getcwd(),
			skipFiles = { "<node_internals>/**" },
		},
	}
end
