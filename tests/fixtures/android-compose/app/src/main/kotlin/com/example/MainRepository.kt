package com.example

import javax.inject.Inject

class MainRepository @Inject constructor() {
    suspend fun fetchItems(): List<String> = emptyList()
}
