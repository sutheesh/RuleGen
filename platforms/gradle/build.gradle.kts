plugins {
    `kotlin-dsl`
    id("com.gradle.plugin-publish") version "1.2.1"
}

group = "io.github.sutheesh"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))
}

gradlePlugin {
    website.set("https://github.com/sutheesh/rulegen")
    vcsUrl.set("https://github.com/sutheesh/rulegen")

    plugins {
        create("rulegen") {
            id = "io.github.sutheesh.rulegen"
            implementationClass = "io.github.sutheesh.rulegen.RuleGenPlugin"
            displayName = "RuleGen"
            description = "Auto-generate AI coding rules from your codebase. Like SwiftLint for AI agents."
            tags.set(listOf("ai", "claude", "cursor", "developer-tools", "automation"))
        }
    }
}

// Publish to Gradle Plugin Portal
// Run: ./gradlew publishPlugins -Pgradle.publish.key=KEY -Pgradle.publish.secret=SECRET
