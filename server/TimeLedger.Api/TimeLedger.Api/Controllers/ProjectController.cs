using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Controllers
{
	[ApiController]
	[Route("api/project")]
	public class ProjectController : ControllerBase
	{
		private readonly TimeLedgerDbContext _db;

		public ProjectController(TimeLedgerDbContext db)
		{
			_db = db;
		}

		[HttpGet("{clientId:int}")]
		public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetProjectsByClientIdAsync(int clientId)
		{
			var responseDto = await _db.Projects
				.AsNoTracking()
				.Where(p => p.ClientId == clientId)
				.OrderBy(p => p.Name)
				.Select(p => new ProjectResponseDto
				{
					Id = p.Id,
					Name = p.Name,
					Description = p.Description,
					Rate = p.Rate,
					IsArchived = p.IsArchived
				})
				.ToListAsync();

			return Ok(responseDto);
		}

		[HttpGet("{clientId:int}/{projectId:int}", Name = nameof(GetProjectByIdAsync))]
		public async Task<ActionResult<ProjectResponseDto>> GetProjectByIdAsync(int clientId, int projectId)
		{
			var responseDto = await _db.Projects
				.AsNoTracking()
				.Where(p => p.ClientId == clientId && p.Id == projectId)
				.Select(p => new ProjectResponseDto
				{
					Id = p.Id,
					Name = p.Name,
					Description = p.Description,
					Rate = p.Rate,
					IsArchived = p.IsArchived
				})
				.FirstOrDefaultAsync();

			if (responseDto == null)
			{
				return NotFound();
			}

			return Ok(responseDto);
		}

		[HttpPost]
		public async Task<ActionResult<ProjectResponseDto>> CreateProjectAsync([FromBody] ProjectCreateDto projectDto)
		{
			var trimmedProjectName = projectDto.Name.Trim();
			var trimmedProjectDescription = projectDto.Description?.Trim();
			Project newProject = new Project
			{
				Name = trimmedProjectName,
				Description = trimmedProjectDescription,
				Rate = projectDto.Rate,
				IsArchived = false,
				ClientId = projectDto.ClientId,
			};

			var clientExists = await _db.Clients.AnyAsync(c => c.Id == projectDto.ClientId);

			if (!clientExists) { return NotFound(); }

			var duplicateExists = await _db.Projects.AnyAsync(p =>
				p.Name.Trim() == trimmedProjectName &&
				p.ClientId == projectDto.ClientId);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique project name."
				});
			}

			_db.Add(newProject);
			await _db.SaveChangesAsync();

			var responseDto = new ProjectResponseDto
			{
				Id = newProject.Id,
				Name = newProject.Name,
				Description = newProject.Description,
				Rate = newProject.Rate,
				IsArchived = newProject.IsArchived
			};

			return CreatedAtRoute(
				nameof(GetProjectByIdAsync),
				new { clientId = projectDto.ClientId, projectId = responseDto.Id },
				responseDto
			);
		}

		[HttpPut("{id:int}")]
		public async Task<ActionResult<ProjectResponseDto>> UpdateProjectAsync(int id, [FromBody] ProjectUpdateDto projectDto)
		{
			var trimmedProjectName = projectDto.Name.Trim();
			var trimmedProjectDescription = projectDto.Description?.Trim();

			var updateProject = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id);
			if (updateProject == null)
			{
				return NotFound();
			}

			var duplicateExists = await _db.Projects.AnyAsync(p =>
				p.Name.Trim() == trimmedProjectName &&
				p.ClientId == updateProject.ClientId &&
				p.Id != id
				);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique project name."
				});
			}

			updateProject.Name = trimmedProjectName;
			updateProject.Description = trimmedProjectDescription;
			updateProject.Rate = projectDto.Rate;
			updateProject.IsArchived = projectDto.IsArchived;

			await _db.SaveChangesAsync();

			ProjectResponseDto responseDto = new()
			{
				Id = updateProject.Id,
				Name = updateProject.Name,
				Description = updateProject.Description,
				Rate = updateProject.Rate,
				IsArchived = updateProject.IsArchived,
			};

			return Ok(responseDto);

		}
	}
}
