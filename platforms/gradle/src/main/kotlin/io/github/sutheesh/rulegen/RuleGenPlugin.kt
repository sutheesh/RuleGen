package io.github.sutheesh.rulegen

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.Exec
import java.io.File
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption

/**
 * RuleGen Gradle Plugin.
 *
 * Registers a `ruleGen` task that runs before `preBuild`.
 * Scans the Android/Kotlin project and generates CLAUDE.md automatically.
 *
 * Usage in build.gradle.kts:
 *   plugins {
 *     id("io.github.sutheesh.rulegen") version "1.0.0"
 *   }
 *
 * That's it. Every `./gradlew build` auto-generates rules.
 */
class RuleGenPlugin : Plugin<Project> {

    companion object {
        const val VERSION = "1.0.0"
        const val TASK_NAME = "ruleGen"
        const val TASK_GROUP = "rulegen"
        const val BINARY_DIR = ".gradle/rulegen"
    }

    override fun apply(project: Project) {
        val binaryPath = resolveBinary(project)

        val ruleGenTask = project.tasks.register(TASK_NAME, Exec::class.java) { task ->
            task.group = TASK_GROUP
            task.description = "Generate AI coding rules from project structure"

            task.commandLine(binaryPath, "--output", project.rootDir.absolutePath, "--silent")

            // Incremental: only re-run when these config files change
            task.inputs.files(
                project.fileTree(project.rootDir) {
                    it.include(
                        "build.gradle.kts", "build.gradle",
                        "settings.gradle.kts", "settings.gradle",
                        "gradle.properties",
                        ".editorconfig",
                        "detekt.yml", "detekt.yaml",
                        ".ktlint", ".ktlintrc",
                        "libs.versions.toml",
                    )
                    it.exclude("**/build/**", "**/.gradle/**")
                }
            )
            task.outputs.file(project.file("CLAUDE.md"))

            // Never fail the build if rulegen fails
            task.isIgnoreExitValue = true
        }

        // Hook into preBuild so it runs automatically — same as SwiftLint's xcodebuild hook
        project.afterEvaluate {
            project.tasks.matching { it.name == "preBuild" }.configureEach { preBuild ->
                preBuild.dependsOn(ruleGenTask)
            }
        }
    }

    /**
     * Finds the rulegen binary using this priority:
     * 1. Locally cached binary in .gradle/rulegen/
     * 2. npx rulegen (if Node.js is available)
     * 3. Downloads the binary from GitHub releases and caches it
     */
    private fun resolveBinary(project: Project): String {
        val localBinary = File(project.rootDir, "$BINARY_DIR/rulegen")
        if (localBinary.exists() && localBinary.canExecute()) {
            return localBinary.absolutePath
        }

        // Try npx (available if Node.js is installed)
        if (commandExists("npx")) {
            return buildNpxWrapper(project)
        }

        // Download and cache the binary
        return downloadBinary(project, localBinary)
    }

    private fun commandExists(command: String): Boolean {
        return try {
            val os = System.getProperty("os.name").lowercase()
            val whichCmd = if (os.contains("win")) arrayOf("where", command) else arrayOf("which", command)
            ProcessBuilder(*whichCmd)
                .redirectErrorStream(true)
                .start()
                .waitFor() == 0
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Creates a wrapper script in the build dir that calls npx.
     * This avoids hardcoding the npx path.
     */
    private fun buildNpxWrapper(project: Project): String {
        val wrapperDir = File(project.buildDir, "rulegen")
        wrapperDir.mkdirs()

        val os = System.getProperty("os.name").lowercase()
        return if (os.contains("win")) {
            val wrapper = File(wrapperDir, "rulegen.bat")
            wrapper.writeText("@echo off\nnpx rulegen %*")
            wrapper.absolutePath
        } else {
            val wrapper = File(wrapperDir, "rulegen.sh")
            wrapper.writeText("#!/bin/sh\nexec npx rulegen \"\$@\"")
            wrapper.setExecutable(true)
            wrapper.absolutePath
        }
    }

    /**
     * Downloads the platform-appropriate binary from GitHub releases.
     * Cached in .gradle/rulegen/ so it only downloads once per project.
     */
    private fun downloadBinary(project: Project, target: File): String {
        val os = System.getProperty("os.name").lowercase()
        val arch = System.getProperty("os.arch").lowercase()

        val binaryName = when {
            os.contains("mac") && arch.contains("aarch64") -> "rulegen-macos-arm64"
            os.contains("mac") -> "rulegen-macos-x64"
            os.contains("linux") && arch.contains("aarch64") -> "rulegen-linux-arm64"
            os.contains("linux") -> "rulegen-linux-x64"
            os.contains("win") -> "rulegen-windows-x64.exe"
            else -> return buildNpxWrapper(project)
        }

        val url = "https://github.com/sutheesh/rulegen/releases/download/v$VERSION/$binaryName"

        try {
            target.parentFile.mkdirs()
            project.logger.lifecycle("RuleGen: Downloading binary from $url")
            URL(url).openStream().use { input ->
                Files.copy(input, target.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
            target.setExecutable(true)
            project.logger.lifecycle("RuleGen: Binary cached at ${target.absolutePath}")
        } catch (e: Exception) {
            project.logger.warn("RuleGen: Failed to download binary (${e.message}). Falling back to npx.")
            return buildNpxWrapper(project)
        }

        return target.absolutePath
    }
}
