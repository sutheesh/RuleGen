// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MySwiftUIApp",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "MySwiftUIApp", targets: ["MySwiftUIApp"]),
    ],
    dependencies: [
        .package(url: "https://github.com/pointfreeco/swift-composable-architecture", from: "1.9.0"),
        .package(url: "https://github.com/realm/SwiftLint", from: "0.54.0"),
    ],
    targets: [
        .target(
            name: "MySwiftUIApp",
            dependencies: [
                .product(name: "ComposableArchitecture", package: "swift-composable-architecture"),
            ]
        ),
        .testTarget(
            name: "MySwiftUIAppTests",
            dependencies: ["MySwiftUIApp"]
        ),
    ]
)
