using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
		private readonly UserManager<ApplicationUser> _userManager;

		public ProjectController(TimeLedgerDbContext db, UserManager<ApplicationUser> userManager)
		{
			_db = db;
			_userManager = userManager;
		}

		[Authorize]
		[HttpGet("{clientId:int}")]
		public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetProjectsByClientIdAsync(int clientId)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var responseDto = await _db.Projects
				.AsNoTracking()
				.Where(p => p.ClientId == clientId && p.Client.UserId == userId)
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

		[Authorize]
		[HttpGet("{clientId:int}/{projectId:int}", Name = nameof(GetProjectByIdAsync))]
		public async Task<ActionResult<ProjectResponseDto>> GetProjectByIdAsync(int clientId, int projectId)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var responseDto = await _db.Projects
				.AsNoTracking()
				.Where(p => p.ClientId == clientId && p.Client.UserId == userId && p.Id == projectId)
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

		[Authorize]
		[HttpPost]
		public async Task<ActionResult<ProjectResponseDto>> CreateProjectAsync([FromBody] ProjectCreateDto projectDto)
		{
			var userId = _userManager.GetUserId(User);

			if (userId == null)
			{
				return Unauthorized();
			}

			var clientExists = await _db.Clients
				.AnyAsync(c => c.Id == projectDto.ClientId && c.UserId == userId);

			if (!clientExists)
			{
				return NotFound();
			}

			Project newProject = new Project
			{
				Name = projectDto.Name,
				Description = projectDto.Description,
				Rate = projectDto.Rate,
				IsArchived = false,
				ClientId = projectDto.ClientId,
			};

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

		[Authorize]
		[HttpPut("{id:int}")]
		public async Task<ActionResult<ProjectResponseDto>> UpdateProjectAsync(int id, [FromBody] ProjectUpdateDto projectDto)
		{
			var userId = _userManager.GetUserId(User);
			if (userId == null)
			{
				return Unauthorized();
			}

			var updateProject = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.Client.UserId == userId);
			if (updateProject == null)
			{
				return NotFound();
			}

			updateProject.Name = projectDto.Name;
			updateProject.Description = projectDto.Description;
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
