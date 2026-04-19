import ComposableArchitecture
import SwiftData

@Reducer
struct AppFeature {
    @ObservableState
    struct State: Equatable {
        var items: [Item] = []
        var isLoading = false
    }

    enum Action {
        case loadItems
        case itemsLoaded([Item])
    }

    var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .loadItems:
                state.isLoading = true
                return .none
            case let .itemsLoaded(items):
                state.items = items
                state.isLoading = false
                return .none
            }
        }
    }
}

struct Item: Identifiable, Equatable {
    let id: UUID
    let title: String
}
