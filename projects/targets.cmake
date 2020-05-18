

# Set default project properties
set_property(GLOBAL PROPERTY USE_FOLDERS TRUE)
set(PROJECT_OUTPUT_DIR ${CMAKE_SOURCE_DIR}/.output)
set(PROJECT_OUTPUT_BUILD_DIR ${PROJECT_OUTPUT_DIR}/build)
if(NOT PACKAGES_OUTPUT_DIR)
set(PACKAGES_OUTPUT_DIR ${PROJECT_OUTPUT_DIR}/packages)
endif()

# Set build multiprocessor
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /MP") # Build multiprocessor

macro(set_project_common_output target outputDir suffix)

  add_custom_command(TARGET ${target} POST_BUILD
    COMMAND node "${NODE_TOOLS_DIR}/packaging/copy-file" --input "$<TARGET_FILE:${target}>" --destination ${outputDir}
    COMMAND node "${NODE_TOOLS_DIR}/packaging/copy-file" --input "$<TARGET_PDB_FILE:${target}>" --destination ${outputDir}
  )
  
  get_target_property(target_type ${target} TYPE)
  if (target_type STREQUAL "SHARED_LIBRARY")
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND node "${NODE_TOOLS_DIR}/packaging/copy-file" --input "$<TARGET_LINKER_FILE:${target}>" --destination ${outputDir}
    )
  endif ()
  
endmacro()


macro(set_project_dll_properties target)

  # Set output properties
  set_project_common_output(${target} "${PROJECT_OUTPUT_BUILD_DIR}/bin" ".dll")

  # Set version includes
  target_include_directories(${target} PRIVATE ${CMAKE_BINARY_DIR})

endmacro()


macro(set_project_exe_properties target)

  # Set output properties
  set_project_common_output(${target} "${PROJECT_OUTPUT_BUILD_DIR}/bin" ".exe")

  # Set version includes
  target_include_directories(${target} PRIVATE ${CMAKE_BINARY_DIR})
  
  # set debug env
  set_target_properties(${target} PROPERTIES 
    VS_DEBUGGER_ENVIRONMENT "PATH=%PATH%;${PROJECT_OUTPUT_BUILD_DIR}/bin"
  )

endmacro()

